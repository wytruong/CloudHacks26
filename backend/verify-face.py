import boto3
import json
import base64
from datetime import datetime

rekognition = boto3.client('rekognition', region_name='us-west-2')
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        
        # Accept both formats — your frontend sends 'image', curl tests send 'imageBase64'
        image_base64 = body.get('image') or body.get('imageBase64', '')
        user_id = body.get('userId') or body.get('accountId', 'jenny')
        event_id = body.get('eventId', '')
        
        image_bytes = base64.b64decode(image_base64)
        
        response = rekognition.search_faces_by_image(
            CollectionId='platform-users',
            Image={'Bytes': image_bytes},
            FaceMatchThreshold=70,
            MaxFaces=1
        )
        
        matches = response.get('FaceMatches', [])
        
        if matches:
            confidence = matches[0]['Similarity']
            matched_id = matches[0]['Face']['ExternalImageId']
            verified = confidence >= 70
        else:
            verified = False
            confidence = 0
            matched_id = None
        
        if event_id:
            table = dynamodb.Table('RiskEvents')
            table.update_item(
                Key={'eventId': event_id},
                UpdateExpression='SET #s = :s, confidence = :c, updatedAt = :t',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={
                    ':s': 'verified' if verified else 'blocked',
                    ':c': str(confidence),
                    ':t': str(datetime.utcnow())
                }
            )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'verified': verified,
                'similarity': round(confidence, 1),
                'confidence': round(confidence, 1),
                'matchedId': matched_id
            })
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'verified': False, 'error': str(e)})
        }