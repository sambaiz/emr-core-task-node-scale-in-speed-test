#!/bin/bash -ex

for i in `seq 1 100`; do
  aws emr add-steps --cluster-id $CLUSTER_ID --steps Type=Spark,Name="Spark app ${i}",ActionOnFailure=CONTINUE,Args=[--class,org.apache.spark.examples.SparkPi,/usr/lib/spark/examples/jars/spark-examples.jar,100]
done