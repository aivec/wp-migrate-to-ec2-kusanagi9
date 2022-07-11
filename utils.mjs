import { generate } from "generate-password";
import { execSync } from "child_process";

export const shell = (command) => execSync(command, {
  shell: '/bin/bash',
  stdio: 'inherit',
});

export const genPwd = () => {
  return generate({
    length: 20,
    symbols: "%_#",
    numbers: true,
    strict: true,
  });
}

export class SSH {
  finalc = "";

  constructor(finalc) {
    this.finalc = finalc;
  }

  sshCentos(command) {
    shell(`chmod 400 ${this.finalc.ec2.centos.pem}`);
    shell(
      `ssh -i ${this.finalc.ec2.centos.pem} -t centos@${this.finalc.ec2.host} "${command}"`
    );
  }

  sshKusanagi(command) {
    shell(`chmod 400 ${this.finalc.ec2.kusanagi.pem}`);
    shell(
      `ssh -i ${this.finalc.ec2.kusanagi.pem} -t kusanagi@${this.finalc.ec2.host} "${command}"`
    );
  }

  uploadKusanagi(localpath, remotepath) {
    shell(`chmod 400 ${this.finalc.ec2.kusanagi.pem}`);
    shell(
      `scp -i ${this.finalc.ec2.kusanagi.pem} ${localpath} kusanagi@${this.finalc.ec2.host}:${remotepath}`
    );
  }

  uploadCentos(localpath, remotepath) {
    shell(`chmod 400 ${this.finalc.ec2.centos.pem}`);
    shell(
      `scp -i ${this.finalc.ec2.centos.pem} ${localpath} centos@${this.finalc.ec2.host}:${remotepath}`
    );
  }

  downloadCentos(remotepath, localpath) {
    shell(`chmod 400 ${this.finalc.ec2.centos.pem}`);
    shell(
      `scp -i ${this.finalc.ec2.centos.pem} centos@${this.finalc.ec2.host}:${remotepath} ${localpath}`
    );
  }
}
