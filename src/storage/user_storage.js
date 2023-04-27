import { v4 as uuidv4 } from 'uuid';
import { S3Client, ListObjectsCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

export class UserStorage {
    constructor(userId, bucket, prefix, s3) {
        this.userId = userId;
        this.bucket = bucket;
        this.prefix = prefix;
        this.s3 = s3;
    }

    upload(file) {
        const uniqueName = uuidv4();
        const key = `${this.prefix}/${this.userId}/${uniqueName}`;

        return this.s3.send(new PutObjectCommand({
            Key: key,
            Bucket: this.bucket,
            Body: file
        }))
            .then((response) => {
                return {...response, key: key};
            })
    }

    getPublicUrl(key) {
        return getSignedUrl(
            this.s3, 
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key
            }),
            {
                expiresIn: 60*60
            });
    }

    getMyFiles() {
        return this.s3.send(new ListObjectsCommand({
            Bucket: this.bucket,
            Prefix: `${this.prefix}/${this.userId}`
        }))
            .then(response => response.Contents)
        ;
    }
}
