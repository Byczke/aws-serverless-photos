import { S3Client } from "@aws-sdk/client-s3"
import { UserStorage } from "./user_storage";

export class StorageFactory {
    constructor(region, bucket, directoryPrefix, credentialsPromise) {
        this.region = region;
        this.bucket = bucket;
        this.credentialsPromise = credentialsPromise;
        this.directoryPrefix = directoryPrefix;
    }

    async createCredentialsAwareS3() {
        return new S3Client({
            region: this.region, 
            credentials: await this.credentialsPromise
        });
    }

    async createUserStorage() {
        const credentials = await this.credentialsPromise();
        const s3 = new S3Client({
            region: this.region,
            credentials: credentials,
        });
        return new UserStorage(credentials.identityId, this.bucket, this.directoryPrefix, s3);
    }
};
