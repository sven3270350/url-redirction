import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import AlbR53 = require('../lib/alb_r53-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AlbR53.AlbR53Stack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});