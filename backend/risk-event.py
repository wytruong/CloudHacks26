import boto3
import json
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        event_id = str(uuid.uuid4())
        
        table = dynamodb.Table('RiskEvents')
        table.put_item(Item={
            'eventId': event_id,
            'userId': body.get('userId', ''),
            'riskScore': str(body.get('riskScore', 0)),
            'status': 'pending',
            'ipAddress': body.get('ipAddress', ''),
            'location': body.get('location', ''),
            'timestamp': str(datetime.utcnow())
        })
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'eventId': event_id, 'status': 'pending'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }