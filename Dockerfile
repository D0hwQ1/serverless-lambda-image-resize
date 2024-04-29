FROM --platform=linux/amd64 amazonlinux:2

WORKDIR /app

COPY . .

RUN yum install -y gcc-c++ make && \
    curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - && \
    yum install -y nodejs && \
    npm i && \
    npm i -g serverless

CMD ["/bin/bash", "-c", "\
        mkdir -p ~/.aws && \
        sls config credentials --provider aws --key $AWS_ACCESS --secret $AWS_SECRET && \
        sed -i 's@$CLOUDFRONT_ID@'$CLOUDFRONT_ID'@' serverless.yml && \
        sed -i 's@$ROLE@'$ROLE'@' serverless.yml && \
        sls deploy \
    "]
