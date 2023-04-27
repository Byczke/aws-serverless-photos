# Ui for uek photos

## build project

```bash
npx webpack build --mode development
```

## release application 
```bash
scp -r ./dist myUser@myServer.pl:/var/www/html
```
```bash
BUCKET_NAME={yourbucketname} aws s3 sync dist/ s3://${BUCKET_NAME}/ --acl=public-read
```

## tools

* nodejs
* npm 
* webpack

## Objectives

* play with AWS serverless