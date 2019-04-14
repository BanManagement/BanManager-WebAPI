#!/bin/bash
- openssl aes-256-cbc -K $encrypted_651df60c2689_key -iv $encrypted_651df60c2689_iv -in .travis/deploy.key.enc -out .travis/deploy.key -d
chmod +x ./.travis/deploy.sh
eval "$(ssh-agent -s)"
chmod 600 .travis/deploy.key
ssh-add .travis/deploy.key
ssh-keyscan $DEPLOY_SERVER >> ~/.ssh/known_hosts
git remote add deploy dokku@$DEPLOY_SERVER:api.demo.banmanagement.com >/dev/null 2>&1
git config --global push.default simple
git stash --all
git checkout master
git push -f deploy master >/dev/null 2>&1
