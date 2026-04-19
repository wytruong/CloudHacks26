import json
import boto3
from datetime import datetime
import random
import string

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp(email, otp, city, country):
    sns = boto3.client('sns', region_name='us-west-2')
    sns.publish(
        TopicArn='arn:aws:sns:us-west-2:543585517891:vault-alerts',
        Subject='🔐 Vault Security — Verification Code',
        Message=f"""Vault Security Verification

Someone is trying to log into your account from {city}, {country}.

Your verification code is: {otp}

This code expires in 5 minutes. If this was not you, ignore this email and your session will be automatically blocked.

— Vault Security Platform
Definitely Safe Co"""
    )

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    # Handle Rekognition face verification
    body_check = json.loads(event.get('body', '{}'))
    if body_check.get('action') == 'rekognition':
        image_data = body_check.get('image', '')
        
        rekognition = boto3.client('rekognition', region_name='us-west-2')
        
        try:
            response = rekognition.compare_faces(
                SourceImage={
                    'S3Object': {
                        #'Bucket': 'vault-reference-photos',
                        #'Name': '20260418_142404.JPG'
                        'Bucket': 'faceid-enrollment-images',
                        'Name': '20260418_142404.jpg'
                    }
                },
                TargetImage={
                    'Bytes': __import__('base64').b64decode(image_data)
                },
                SimilarityThreshold=80
            )
            
            matches = response.get('FaceMatches', [])
            verified = len(matches) > 0
            similarity = matches[0]['Similarity'] if matches else 0
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'verified': verified, 'similarity': round(similarity, 1)})
            }
        except Exception as e:
            print(f"Rekognition error: {e}")
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'verified': False, 'error': str(e)})
            }
    
    # Handle WebSocket connect/disconnect
    route = event.get('requestContext', {}).get('routeKey', '')
    connection_id = event.get('requestContext', {}).get('connectionId', '')
    
    dynamodb = boto3.resource('dynamodb')
    connections_table = dynamodb.Table('vault-connections')
    
    if route == '$connect':
        connections_table.put_item(Item={'connectionId': connection_id})
        return {'statusCode': 200, 'body': 'Connected'}
    
    if route == '$disconnect':
        connections_table.delete_item(Key={'connectionId': connection_id})
        return {'statusCode': 200, 'body': 'Disconnected'}
    
    body = json.loads(event.get('body', '{}'))
    
    bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')
    
    prompt = f"""Analyze this login event and return ONLY a JSON object with no explanation, no markdown, no backticks.

Login event: {json.dumps(body)}

Return exactly this format:
{{"confidence": 97, "verdict": "BLOCK", "reasoning": ["step 1", "step 2", "step 3", "step 4", "step 5"]}}

Rules:
- confidence 90-100 = BLOCK
- confidence 60-89 = CONFIRM
- confidence 0-59 = FLAG
- Consider: location, time, device, MFA, login attempts"""

    response = bedrock.invoke_model(
        modelId='us.anthropic.claude-sonnet-4-6',
        guardrailIdentifier='se0v7syfzj2g',
        guardrailVersion='DRAFT',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "messages": [{"role": "user", "content": prompt}]
        })
    )
    
    result = json.loads(response['body'].read())
    raw_text = result['content'][0]['text'].strip()
    print("Bedrock raw response:", raw_text)
    
    if raw_text.startswith('```'):
        raw_text = raw_text.split('```')[1]
        if raw_text.startswith('json'):
            raw_text = raw_text[4:]
    
    analysis = json.loads(raw_text.strip())
    
    events_table = dynamodb.Table('vault-events')
    events_table.put_item(Item={
        'accountId': body.get('accountId', 'unknown'),
        'timestamp': datetime.utcnow().isoformat(),
        'event': json.dumps(body),
        'analysis': json.dumps(analysis)
    })
    
    incident = {
        'id': f"ws-{datetime.utcnow().isoformat()}",
        'accountId': body.get('accountId', 'unknown'),
        'city': body.get('city', 'Unknown'),
        'country': body.get('country', 'XX'),
        'confidence': analysis['confidence'],
        'verdict': analysis['verdict'],
        'reasoning': analysis['reasoning'],
        'timestamp': datetime.utcnow().isoformat()
    }
    
    apigw = boto3.client(
        'apigatewaymanagementapi',
        endpoint_url='https://4y8tbuqggh.execute-api.us-west-2.amazonaws.com/production'
    )
    
    connections = connections_table.scan()
    for conn in connections.get('Items', []):
        try:
            apigw.post_to_connection(
                ConnectionId=conn['connectionId'],
                Data=json.dumps(incident)
            )
        except Exception as e:
            print(f"Failed to send to {conn['connectionId']}: {e}")

    # Send OTP for medium confidence events
    if 60 <= analysis['confidence'] <= 89:
        otp = generate_otp()
        analysis['requiresSelfie'] = True
        analysis['otpSent'] = True
        
        otp_table = dynamodb.Table('vault-otp')
        otp_table.put_item(Item={
            'accountId': body.get('accountId', 'unknown'),
            'otp': otp,
            'timestamp': datetime.utcnow().isoformat(),
            'used': False
        })
        
        send_otp(
            body.get('accountId', 'unknown'),
            otp,
            body.get('city', 'Unknown'),
            body.get('country', 'XX')
        )

    # Send real email for BLOCK events
    if analysis['verdict'] == 'BLOCK':
        sns = boto3.client('sns', region_name='us-west-2')
        sns.publish(
            TopicArn='arn:aws:sns:us-west-2:543585517891:vault-alerts',
            Subject=f"🚨 Vault Alert: Suspicious login blocked on {body.get('accountId', 'unknown')}",
            Message=f"""Vault Security Alert

Account: {body.get('accountId', 'unknown')}
Location: {body.get('city', 'Unknown')}, {body.get('country', 'XX')}
IP Address: {body.get('ip', 'Unknown')}
Confidence: {analysis['confidence']}%
Verdict: {analysis['verdict']}

AI Analysis:
{chr(10).join(analysis['reasoning'])}

Response Time: 4 seconds
Session automatically terminated.
Logged to DynamoDB.

— Vault Security Platform
UCI CloudHacks 2026"""
        )
    return {
        'statusCode': 200,
        'body': json.dumps(analysis)
    }
