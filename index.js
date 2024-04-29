"use strict";

import Sharp from "sharp";
import gifResize from "@gumlet/gif-resize";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
const S3 = new S3Client({
  region: "ap-northeast-2",
});

const getQuerystring = (querystring, key) => {
  return new URLSearchParams("?" + querystring).get(key);
};

export const imageResize = async (event, context) => {
  console.log("imageResize 실행!!");

  //===================================================================
  //event에서 요청데이터 가져오기
  const { request, response } = event.Records[0].cf;

  //쿼리스트링 가져오기
  //쿼리스트링이 존재하지 않다면 리사이즈 처리할 필요 없으니 원본 반환
  const querystring = request.querystring;
  if (!querystring) {
    console.log("querystring is empty!! return origin");
    return response;
  }

  //uri 가져오기
  const uri = decodeURIComponent(request.uri);
  //파일명이 영어인 경우 : "/samples/chun.jpeg"
  //파일명이 한글인 경우 : "/samples/%E1%84%86%E1%85%A9%E1%84%85%E1%85%A1%E1%86%AB.png"

  //파일 확장자 가져오기
  const extension = uri.match(/(.*)\.(.*)/)[2].toLowerCase();
  console.log("extension", extension);

  //쿼리스트링 파싱
  const width = Number(getQuerystring(querystring, "w")) || null;
  const height = Number(getQuerystring(querystring, "h")) || null;
  const fit = getQuerystring(querystring, "f");
  const quality = Number(getQuerystring(querystring, "q")) || null;
  console.log({
    width,
    height,
    fit,
    quality,
  });

  //s3 데이터 가져오기
  const s3BucketDomainName = request.origin.s3.domainName;
  let s3BucketName = s3BucketDomainName.replace(".s3.ap-northeast-2.amazonaws.com", "");
  s3BucketName = s3BucketName.replace(".s3.amazonaws.com", "");
  console.log("s3BucketName", s3BucketName);
  const s3Path = uri.substring(1);
  //===================================================================

  //S3에서 이미지 가져오기
  let s3Object = null;
  try {
    s3Object = await S3.send(
      new GetObjectCommand({
        Bucket: s3BucketName,
        Key: s3Path,
      }),
    );
    console.log("S3 GetObject Success");
  } catch (err) {
    console.log("S3 GetObject Fail!! \n" + "Bucket: " + s3BucketName + ", Path: " + s3Path + "\n" + "err: " + err);
    return err;
  }

  //이미지 리사이즈 수행
  const s3Uint8ArrayData = await s3Object.Body.transformToByteArray();
  console.log("s3Uint8ArrayData", s3Uint8ArrayData);

  let resizedImage = null;

  try {
    if (extension === "gif") {
      console.log("extension is gif!!");
      resizedImage = await gifResize({ width, height })(Buffer.from(s3Uint8ArrayData));
    } else
      resizedImage = await Sharp(s3Uint8ArrayData)
        .resize({
          width: width,
          height: height,
          fit: fit,
        })
        .toFormat(extension, {
          quality: quality,
        })
        .toBuffer();
    console.log("Sharp Resize Success");
  } catch (err) {
    console.log("Sharp Resize Fail!! \n" + "Bucket: " + s3BucketName + ", Path: " + s3Path + "\n" + "err: " + err);
    return err;
  }

  //람다엣지에서 응답을 만드는 경우, 응답할 수 있는 body에 크기제한이 있다.
  //base64 인코딩 텍스트로 반환하는 경우 1.3MB(1,048,576 byte)까지 가능.
  const resizedImageByteLength = Buffer.byteLength(resizedImage, "base64");
  console.log("resizedImageByteLength:", resizedImageByteLength);

  //리사이징한 이미지 크기가 1MB 이상인 경우 원본 반환
  if (resizedImageByteLength >= 1048576) {
    console.log("resizedImageByteLength >= 1048576!! return origin");
    return response;
  }

  //리사이징한 이미지 응답할 수 있도록 response 수정
  response.status = 200;
  response.body = resizedImage.toString("base64");
  response.bodyEncoding = "base64";
  console.log("imageResize 종료!!");
  return response;
};
