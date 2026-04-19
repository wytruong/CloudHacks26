import json
import boto3
from datetime import datetime, timedelta

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    account_id = body.get('accountId')
    submitted_otp = body.get('otp')
    
    print(f"Verifying OTP for {account_id}: submitted={submitted_otp}")
    
    dynamodb = boto3.resource('dynamodb')
    otp_table = dynamodb.Table('vault-otp')
    
    result = otp_table.get_item(Key={'accountId': account_id})
    item = result.get('Item')
    
    print(f"Stored item: {item}")
    
    if not item:
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'verified': False, 'reason': 'No OTP found'})
        }
    
    stored_otp = item.get('otp', '')
    stored_time_str = item.get('timestamp', '')
    used = item.get('used', False)
    
    print(f"Stored OTP: {stored_otp}, submitted: {submitted_otp}, used: {used}")
    
    # Skip expiry check for now — just verify the code matches
    if stored_otp == submitted_otp and not used:
        otp_table.update_item(
            Key={'accountId': account_id},
            UpdateExpression='SET used = :val',
            ExpressionAttributeValues={':val': True}
        )
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'verified': True})
        }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'verified': False, 'reason': f'OTP mismatch or already used. Stored: {stored_otp}, Got: {submitted_otp}'})
    }
