FROM --platform=linux/amd64 amazonlinux:2

WORKDIR /app

COPY . .

RUN curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - && \
    yum install -y nodejs && \
    npm i && \
    npm i -g serverless

CMD ["/bin/bash", "-c", "\
        mkdir -p ~/.aws && \
        # echo -e \"[default]\\naws_access_key_id = $AWS_ACCESS\\naws_secret_access_key = $AWS_SECRET\" > ~/.aws/credentials && \
        sls config credentials --provider aws --key $AWS_ACCESS --secret $AWS_SECRET && \
        sed -i 's@$CLOUDFRONT_ID@'$CLOUDFRONT_ID'@' serverless.yml && \
        sed -i 's@$ROLE@'$ROLE'@' serverless.yml && \
        sls deploy \
    "]
