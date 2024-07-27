#!/bin/bash

set -euxo pipefail

# Get the AWS Application Load Balancer DNS
export WP_LB_DNS=$(aws ssm get-parameters --names /wordpress/load-balancer/dns | jq -r .Parameters[0].Value)

# Get the EFS ID
export WP_EFS_ID=$(aws ssm get-parameters --names /wordpress/efs/id | jq -r .Parameters[0].Value)

# Get the Database Credentials from SecretsManager
export WP_DB_CREDENTIALS=$(aws secretsmanager get-secret-value --secret-id wordpress/database/admin-credentials --query SecretString --output text)
export WP_DB_HOST=$(echo $WP_DB_CREDENTIALS | jq -r .host)
export WP_DB_PORT=$(echo $WP_DB_CREDENTIALS | jq -r .port)
export WP_DB_NAME=$(echo $WP_DB_CREDENTIALS | jq -r .dbname)
export WP_DB_USERNAME=$(echo $WP_DB_CREDENTIALS | jq -r .username)
export WP_DB_PASSWORD=$(echo $WP_DB_CREDENTIALS | jq -r .password)

# Install the necessary packages
dnf -y update
dnf -y install amazon-efs-utils wget php-mysqlnd httpd php-fpm php-mysqli mariadb105-server php-json php php-devel stress

# Start and enable Apache and MariaDB services
systemctl enable httpd
systemctl enable mariadb
systemctl start httpd
systemctl start mariadb

# Download and install WordPress
wget http://wordpress.org/latest.tar.gz -P /var/www/html
cd /var/www/html
tar -zxvf latest.tar.gz
cp -rvf wordpress/* .
rm -R wordpress
rm latest.tar.gz

cp ./wp-config-sample.php ./wp-config.php

# Update the wp-config.php file with the database credentials
sed -i "s/'localhost'/'$WP_DB_HOST'/g" wp-config.php
sed -i "s/'database_name_here'/'$WP_DB_NAME'/g" wp-config.php
sed -i "s/'username_here'/'$WP_DB_USERNAME'/g" wp-config.php
sed -i "s/'password_here'/'$WP_DB_PASSWORD'/g" wp-config.php

# Fix permissions
usermod -a -G apache ec2-user
chown -R ec2-user:apache /var/www
chmod 2775 /var/www
find /var/www -type d -exec chmod 2775 {} \;
find /var/www -type f -exec chmod 0664 {} \;

# Mount EFS and move wp-content to it
mv wp-content/ /tmp
mkdir wp-content
sh -c "echo -e '$WP_EFS_ID:/ /var/www/html/wp-content efs _netdev,tls,iam 0 0' >> /etc/fstab"
mount -a -t efs defaults
mv /tmp/wp-content/* /var/www/html/wp-content/
chown -R ec2-user:apache /var/www/

# Download and install the WordPress CLI
# curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
# chmod +x wp-cli.phar
# mv wp-cli.phar /usr/local/bin/wp

# Setup WordPress using the CLI
# wp core install --url=wp.demo --title="WordPress Demo" --admin_user=admin --admin_password=admin --admin_email=admin@wp.demo
