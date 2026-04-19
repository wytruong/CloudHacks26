import boto3, uuid, base64

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    body = event['body']  # { userId, imageBase64 }
    user_id = body['userId']
    image_bytes = base64.b64decode(body['imageBase64'])
    
    # Upload raw image to S3
    s3.put_object(Bucket='faceid-enrollment-images', Key=f"{user_id}.jpg", Body=image_bytes)
    
    # Index face in Rekognition collection
    response = rekognition.index_faces(
        CollectionId='platform-users',
        Image={'Bytes': image_bytes},
        ExternalImageId=user_id,
        DetectionAttributes=[]
    )
    
    face_id = response['FaceRecords'][0]['Face']['FaceId']
    
    # Store in DynamoDB
    table = dynamodb.Table('Users')
    table.put_item(Item={
        'userId': user_id,
        'rekognitionFaceId': face_id,
        'enrolledAt': str(datetime.utcnow())
    })
    
    return {'statusCode': 200, 'body': {'faceId': face_id}}