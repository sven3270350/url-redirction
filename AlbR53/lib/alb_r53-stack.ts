import core = require('@aws-cdk/core');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import ec2 = require('@aws-cdk/aws-ec2');
import route53 = require('@aws-cdk/aws-route53');

export class AlbR53Stack extends core.Stack {
  constructor(scope: core.App, id: string, props?: core.StackProps) {
    super(scope, id, props);

    // parse json
    const fs = require('fs');
    const fileContents = fs.readFileSync('./data.json', 'utf8');

    try {
      var data = JSON.parse(fileContents)
    } catch(err) {
      console.error(err);
    }

    for (let domain_name in data.domain) {

      //// r53

      // get zone
      const zone = route53.HostedZone.fromLookup(this, 'MyZone', {
        domainName: domain_name
      });

      // create records
      for (let rec in data.domain[domain_name]['r53']['type']['A']) {
        new route53.ARecord(this, 'ARecord' + Number(rec), {
          zone: zone,
          recordName: data.domain[domain_name]['r53']['type']['A'][rec]['recordName'],
          target: route53.RecordTarget.fromIpAddresses(data.domain[domain_name]['r53']['type']['A'][rec]['target'])
        });
      }

      //// alb

      // get default vpc
      const vpc =  ec2.Vpc.fromLookup(this, 'DefaultVpc', {
          isDefault: true
      });

      // create lb
      const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
        vpc,
        internetFacing: true
      });

      // http listener
      const listener = lb.addListener('ListenerHttp', {
        protocol: elbv2.ApplicationProtocol.HTTP,
      });

      // http DummyResponse
      listener.addFixedResponse('Fixed', {
        statusCode: '404'
      });

      // redirect http to https
      const cfnHttpListener = listener.node.defaultChild as elbv2.CfnListener;
      cfnHttpListener.defaultActions = [{
        type: "redirect",
        redirectConfig: {
          protocol: "HTTPS",
          host: "#{host}",
          path: "/#{path}",
          query: "#{query}",
          port: "443",
          statusCode: "HTTP_301"
        }
      }];

      // https listener
      const listenerhttps = lb.addListener('ListenerHttps', {
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificateArns: [data.domain[domain_name]['alb']['certificateArns']]
      });

      // https DummyResponse
      listenerhttps.addFixedResponse('Fixed', {
        statusCode: '404'
      });

      // https rules
      for (let i in data.domain[domain_name]['alb']['priority']) {
        new elbv2.CfnListenerRule(this, 'resource' + Number(i), {
          listenerArn: listenerhttps.listenerArn,
          priority: Number(i),
          conditions: [
            {
              field: data.domain[domain_name]['alb']['priority'][i]['field'],
              values: [data.domain[domain_name]['alb']['priority'][i]['values']]
            }
          ],
          actions: [
            {
              type: "redirect",
              redirectConfig: {
                protocol: data.domain[domain_name]['alb']['priority'][i]['protocol'],
                port: data.domain[domain_name]['alb']['priority'][i]['port'],
                host: data.domain[domain_name]['alb']['priority'][i]['host'],
                path: data.domain[domain_name]['alb']['priority'][i]['path'],
                query: data.domain[domain_name]['alb']['priority'][i]['query'],
                statusCode: data.domain[domain_name]['alb']['priority'][i]['statusCode']
              }
            }
          ]
        });
      }
    }
  }
}
