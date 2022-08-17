import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';

export class AppStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('./src'),
      handler: 'index.handler',
      layers: this.layers()
    });

    const topics = ['user_registered', 'paid_order'];
    const policy = new iam.PolicyStatement();
    policy.addActions('sns:Publish');
    for (const topicName of topics) {
      const topicArn = this.topicArn(topicName);
      policy.addResources(topicArn);
      lambdaFunction.addEnvironment(
        `TOPIC_${topicName.toUpperCase()}_ARN`,
        topicArn
      );
    }
    lambdaFunction.addToRolePolicy(policy);

    const api = new apigateway.RestApi(this, 'api');
    api.root.addProxy({
      anyMethod: true,
      defaultIntegration: new apigateway.LambdaIntegration(lambdaFunction)
    });
  }

  private topicArn(topicName: string): string {
    const topicReference = topicName.replace(/_/g, '-') + '-arn';

    return cdk.Fn.importValue(topicReference);
  }

  private layers(): lambda.ILayerVersion[] {
    const layer = lambda.LayerVersion.fromLayerVersionArn(
      this, 'latestLayer',  cdk.Fn.importValue('sns-lib-layer')
    );
    const apiLayer = new lambda.LayerVersion(this, 'api-lib', {
      code: lambda.Code.fromAsset(`${__dirname}/../../layers/api-lib`),
      compatibleRuntimes: [ lambda.Runtime.NODEJS_14_X],
    });

    return [layer, apiLayer];
  }
}
