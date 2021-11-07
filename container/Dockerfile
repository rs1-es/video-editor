FROM public.ecr.aws/lambda/nodejs:12
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12

RUN yum update -y && yum install -y amazon-linux-extras

RUN amazon-linux-extras install -y python3.8

RUN pip3.8 install youtube_dl

COPY utils/ /opt/

COPY lambda/applychanges/index.js ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]