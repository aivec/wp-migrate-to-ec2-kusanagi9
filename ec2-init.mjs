import { exec } from 'child_process';
import _ from 'lodash';
import { updateConfigFile } from './config.mjs';
import { SSH, shell, genPwd } from "./utils.mjs";

/**
 * Initialize kusanagi (Nginx, MySQL, etc)
 */
export const ec2Init = (config, callback = () => {}) => {
  const client = new SSH(config);

  client.sshCentos("sudo dnf update -y");
  
  exec(`ssh -i ${config.ec2.centos.pem} -t centos@${config.ec2.host} "sudo reboot"`, () => {
    console.log('Rebooted. Waiting for instance to come back online...')
    shell('sleep 60');

    const kusanagiPwd = genPwd();
    const dbpwd = genPwd();
  
    const outjson = _.cloneDeep(config);
  
    client.sshCentos(
      `sudo su - -c 'kusanagi init --tz Asia/Tokyo --lang ja --keyboard en --passwd \"${kusanagiPwd}\" --nophrase --dbrootpass \"${dbpwd}\" --nginx121 --php74 --mariadb10.5'`
    );
  
    outjson.ec2.kusanagi.userpwd = kusanagiPwd;
    outjson.ec2.mysqlRootPass = dbpwd;
    updateConfigFile(outjson);
  
    client.sshCentos(
      'sudo mv /root/kusanagi.pem /home/centos/ && sudo chown centos:centos /home/centos/kusanagi.pem'
    );
  
    // download kusanagi SSH private key
    client.downloadCentos("/home/centos/kusanagi.pem", "./");
    shell(`mv -f ./kusanagi.pem ${config.ec2.kusanagi.pem}`);
    shell(`chmod 400 ${config.ec2.kusanagi.pem}`);

    callback();
  });
};
