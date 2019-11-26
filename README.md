# url-redirect
[AWS CDK program to redirect URLs. Designed to handle paths.](https://docs.aws.amazon.com/en_us/cdk/latest/guide/getting_started.html)

Need to do:

1.Exporting aws account wariables

```
# export AWS_DEFAULT_REGION=eu-central-1
# export AWS_DEFAULT_REGION=eu-central-1
# export CDK_DEPLOY_REGION=eu-central-1
# export CDK_DEPLOY_ACCOUNT=111111111111
# export AWS_SECRET_ACCESS_KEY=9999999999999999999999999999999999999999
# export AWS_ACCESS_KEY_ID=AAAAAAAAAAAAAAAAAAAA
```

1.change setting into files AlbR53/data.yml, AlbR53/bin/alb_r53.ts

```
account: 'xxxxxxxxxx',
region: 'eu-central-1'
```

2.Come into working dir in project

```
# cd ~/IdeaProjects/url-redirect/AlbR53
```

3.Compile and see CloudFormation template

```
# npm run build;cdk synth
```

4.Deploy stack
```
# cdk deploy
```
5.Additional commands (just for interest)
```
# aws confugure
# npm install @types/node
# npm install @aws-cdk/aws-s3
# cdk ls
# npm install --save js-yaml
# npm update
```