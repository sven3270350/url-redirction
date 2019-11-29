#!/usr/bin/env bash

cd AlbR53
npm run build
cdk synth
cdk deploy --require-approval never

#cdk destyroy