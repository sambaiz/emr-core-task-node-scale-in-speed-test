import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as emr from 'aws-cdk-lib/aws-emr';

export class EmrCoreTaskNodeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bootStrapBucket = "<your-bootstrap-bucket>"

    const configurations: emr.CfnCluster.ConfigurationProperty[] = [
      {
        classification: 'spark',
        configurationProperties: {
          maximizeResourceAllocation: 'true',
        },
      },
      {
        classification: 'spark-hive-site',
        configurationProperties: {
          'hive.metastore.client.factory.class':
              'com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory',
        },
      }
    ]

    new emr.CfnCluster(this, 'EmrCluster', {
      name: this.stackName,
      applications: [
        {
          name: 'Spark',
        },
      ],
      instances: {
        masterInstanceFleet: {
          targetOnDemandCapacity: 1,
          instanceTypeConfigs: [
            {
              instanceType: 'm6g.xlarge',
            },
          ],
        },
        coreInstanceFleet: {
          targetOnDemandCapacity: 2,
          instanceTypeConfigs: [
            {
              instanceType: 'm6g.xlarge',
            },
          ],
        },
        taskInstanceFleets: [{
          name: 'Task nodes',
          targetSpotCapacity: 1,
          instanceTypeConfigs: [
            {
              instanceType: 'm6g.xlarge',
              bidPriceAsPercentageOfOnDemandPrice: 100,
            },
          ],
          launchSpecifications: {
            spotSpecification: {
              timeoutAction: 'SWITCH_TO_ON_DEMAND',
              timeoutDurationMinutes: 5,
            },
          },
        }],
      },
      bootstrapActions: [
        {
          name: 'install-ssm-agent',
          scriptBootstrapAction: {
            path: `s3://${bootStrapBucket}/install-ssm-agent.sh`,
          },
        },
      ],
      configurations: configurations,
      managedScalingPolicy: {
        computeLimits: {
          maximumCapacityUnits: 10,
          maximumCoreCapacityUnits: 2,
          minimumCapacityUnits: 2,
          unitType: 'InstanceFleetUnits',
        },
      },
      releaseLabel: 'emr-6.10.0',
      stepConcurrencyLevel: 10,
      visibleToAllUsers: true,
      tags: [
        {
          key: 'Name',
          value: this.stackName,
        },
      ],
      jobFlowRole: 'EMR_EC2_DefaultRole',
      serviceRole: 'EMR_DefaultRole',
    })
  }
}
