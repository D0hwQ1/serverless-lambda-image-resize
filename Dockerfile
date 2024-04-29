FROM --platform=linux/amd64 amazonlinux:2

WORKDIR /app

COPY . .

RUN yum install -y autoconf automake intltool gcc-c++ make wget tar && \
    curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - && \
    yum install -y nodejs && \
    npm i && \
    npm i -g serverless

RUN yum install -y wget && wget https://github.com/kohler/gifsicle/archive/v1.92.tar.gz && \
    tar -xzf v1.92.tar.gz && \
    cd gifsicle-1.92 && \
    autoreconf -i && \
    ./configure --disable-gifview && \
    make && \
    mv src/gifsicle ../node_modules/gifsicle/vendor/gifsicle && \
    cd ../ && rm -rf gifsicle-1.92


CMD ["/bin/bash", "-c", "\
        mkdir -p ~/.aws && \
        sls config credentials --provider aws --key $AWS_ACCESS --secret $AWS_SECRET && \
        sed -i 's@$CLOUDFRONT_ID@'$CLOUDFRONT_ID'@' serverless.yml && \
        sed -i 's@$ROLE@'$ROLE'@' serverless.yml && \
        sls deploy --force \
    "]
