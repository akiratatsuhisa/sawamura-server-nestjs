import _ from 'lodash';
import { Jwt } from 'src/helpers/jwt.helper';

export class IdentityUser {
  public id: string;
  public username: string;
  public email: string;
  public firstName: string;
  public lastName: string;
  public birthDate: string;
  public salary: number;
  public roles: Array<string>;
  public photoUrl: string;
  public coverUrl: string;
  public securityStamp: string;

  constructor(payload?: Record<string, any>) {
    this.id = Jwt.get(payload, 'sub');
    this.username = Jwt.get(payload, 'username');
    this.email = Jwt.get(payload, 'email');
    this.firstName = Jwt.get(payload, 'firstName');
    this.lastName = Jwt.get(payload, 'lastName');
    this.birthDate = Jwt.get(payload, 'birthDate');
    this.salary = Jwt.get(payload, 'salary', 'number');
    this.roles = Jwt.getAll(payload, 'roles');
    this.photoUrl = Jwt.get(payload, 'photoUrl');
    this.coverUrl = Jwt.get(payload, 'coverUrl');
    this.securityStamp = Jwt.get(payload, 'securityStamp');
  }
}

export class IdentityPrincipal {
  public user?: IdentityUser;

  public get isAuthenticated() {
    return this.user != null && this.user instanceof IdentityUser;
  }

  constructor(user?: IdentityUser) {
    this.user = user;
  }

  public isInRole(name: string): boolean {
    return _.includes(this.user?.roles, name);
  }

  public someRoles(...names: Array<string>): boolean {
    return _.some(this.user?.roles, (role) => _.includes(names, role));
  }

  public everyRoles(...names: Array<string>): boolean {
    return _.every(this.user?.roles, (role) => _.includes(names, role));
  }
}
