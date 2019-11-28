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

        // list objects
        // https://stackoverflow.com/questions/35435042/how-can-i-define-an-array-of-objects
        type ListObj = {
            SRC: string;
            SRC_PROTOCOL: string;
            SRC_DOMAIN: string;
            SRC_PATH: string;
            TGT: string;
            TGT_PROTOCOL: string;
            TGT_PORT: string;
            TGT_DOMAIN: string;
            TGT_PATH: string;
            CERT: string;
            COMMENT: string;
        }
        var listobj: ListObj[] = [];
        var test: ListObj[] = [];

        // data parsing - prom yml to listobj
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

            listobj.push({
                "SRC": SRC,
                "SRC_PROTOCOL": SRC_PROTOCOL,
                "SRC_DOMAIN": SRC_DOMAIN,
                "SRC_PATH": SRC_PATH,
                "TGT": TGT,
                "TGT_PROTOCOL": TGT_PROTOCOL,
                "TGT_PORT": TGT_PORT,
                "TGT_DOMAIN": TGT_DOMAIN,
                "TGT_PATH": TGT_PATH,
                "CERT": CERT,
                "COMMENT": COMMENT
            });
        };

        // print data
        for (let rule in listobj) {
            console.log();
            console.log(rule);
            console.log('SRC: ' + listobj[rule].SRC);
            console.log('SRC_PROTOCOL: ' + listobj[rule].SRC_PROTOCOL);
            console.log('SRC_DOMAIN: ' + listobj[rule].SRC_DOMAIN);
            console.log('SRC_PATH: ' + listobj[rule].SRC_PATH);

            console.log();
            console.log('TGT: ' + listobj[rule].TGT);
            console.log('TGT_PROTOCOL: ' + listobj[rule].TGT_PROTOCOL);
            console.log('TGT_PORT: ' + listobj[rule].TGT_PORT);
            console.log('TGT_DOMAIN: ' + listobj[rule].TGT_DOMAIN);
            console.log('TGT_PATH: ' + listobj[rule].TGT_PATH);

            console.log();
            console.log('CERT: ' + listobj[rule].CERT);
            console.log('COMMENT: ' + listobj[rule].COMMENT);
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

        // create listener http dummy response
        listener.addFixedResponse('Fixed', {
            statusCode: '404'
        });

        // do we need https redirects
        // https://stackoverflow.com/questions/42790602/how-do-i-check-whether-an-array-contains-a-string-in-typescript
        if (listobj.some(e => e.SRC_PROTOCOL === 'https' && e.CERT)) {
            console.log("We have https")

            for (let proto in listobj) {
                if (listobj[proto].SRC_PROTOCOL === 'https') {
                    console.log('Need to crate https listener')
                    const listenerhttps = lb.addListener('ListenerHttps', {
                        protocol: elbv2.ApplicationProtocol.HTTPS,
                        certificateArns: [listobj[proto].CERT]
                    });

                    // https DummyResponse
                    listenerhttps.addFixedResponse('Fixed', {
                        statusCode: '404'
                    });
                }
            }
        }
    }
}