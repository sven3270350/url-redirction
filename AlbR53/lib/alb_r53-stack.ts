import core = require('@aws-cdk/core');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import ec2 = require('@aws-cdk/aws-ec2');
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets');

export class AlbR53Stack extends core.Stack {
    constructor(scope: core.App, id: string, props?: core.StackProps) {
        super(scope, id, props);

        // parse yml
        const yaml = require('js-yaml');
        const fs = require('fs');
        try {
            var data = yaml.safeLoad(fs.readFileSync('data.yml', 'utf8'));
        } catch (e) {
            console.log(e);
        }

        // create vpc
        const vpc = new ec2.Vpc(this, "VPC", {
            maxAzs: 2 // Default is all AZs in region
        });

        // create lb
        const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
            vpc,
            internetFacing: true
        });

        // create listener
        const listener = lb.addListener('ListenerHttp', {
            protocol: elbv2.ApplicationProtocol.HTTP,
        });

        // create listener dummy response
        listener.addFixedResponse('Fixed', {
            statusCode: '404'
        });

        // create array for uniq values
        var string_arr = new Array();

        for (let redirects in data.redirects) {
            // src parse
            var SRC: string = data.redirects[redirects].source;
            var SRC_PROTOCOL: string = SRC.split('//')[0].split(':')[0];
            const SRC_DOMAIN: string = SRC.split('/')[2];
            if (SRC.split('/')[3]) {
                var SRC_PATH: string = '/' + SRC.split('/')[3];
            } else {
                var SRC_PATH: string = '/';
            }
            string_arr.push(SRC_DOMAIN);

            // tgt parse
            var TGT: string = data.redirects[redirects].target;
            var TGT_PROTOCOL: string = TGT.split('//')[0].split(':')[0].toLocaleUpperCase();
            if (TGT_PROTOCOL === 'HTTPS') {
                var TGT_PORT = '443';
            } else {
                var TGT_PORT = '80';
            }
            var TGT_DOMAIN: string = TGT.split('/')[2];
            if (TGT.split('/')[3]) {
                var TGT_PATH: string = '/' + TGT.split('/')[3];
            } else {
                var TGT_PATH: string = '/';
            }

            // oth parse
            var CERT: string = data.redirects[redirects].cert;
            var COMMENT: string = data.redirects[redirects].comment;

            new elbv2.CfnListenerRule(this, 'resource' + Number(redirects), {
                listenerArn: listener.listenerArn,
                priority: Number(redirects) + 1,
                conditions: [
                    {
                        field: 'path-pattern',
                        values: [SRC_PATH]
                    }
                ],
                actions: [
                    {
                        type: "redirect",
                        redirectConfig: {
                            protocol: TGT_PROTOCOL,
                            port: TGT_PORT,
                            host: TGT_DOMAIN,
                            path: TGT_PATH,
                            query: "#{query}",
                            statusCode: "HTTP_301"
                        }
                    }
                ]
            });

            console.log();
            console.log(redirects);
            console.log('SRC: ' + SRC);
            console.log('SRC_PROTOCOL: ' + SRC_PROTOCOL);
            console.log('SRC_DOMAIN: ' + SRC_DOMAIN);
            console.log('SRC_PATH: ' + SRC_PATH);

            console.log();
            console.log('TGT: ' + TGT);
            console.log('TGT_PROTOCOL: ' + TGT_PROTOCOL);
            console.log('TGT_PORT: ' + TGT_PORT);
            console.log('TGT_DOMAIN: ' + TGT_DOMAIN);
            console.log('TGT_PATH: ' + TGT_PATH);

            console.log();
            console.log('CERT: ' + CERT);
            console.log('COMMENT: ' + COMMENT);

        };

        // create array with uniq domains
        var uniqueItems = Array.from(new Set(string_arr));

        for (let uniqDomain in uniqueItems) {
            // create record on elb
            new route53.ARecord(this, 'alias' + Number(uniqDomain), {
                zone: route53.HostedZone.fromLookup(this, 'MyZone' + Number(uniqDomain), {
                    domainName: uniqueItems[uniqDomain]
                }),
                target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(lb))
            });
        }
    }
}