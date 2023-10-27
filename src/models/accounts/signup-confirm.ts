import { BaseModel } from '../base';

export enum SignupConfirmType {
    None = 0,
    Email
}

export class SignupConfirm extends BaseModel {
    static Type = SignupConfirmType;

    type: SignupConfirmType = SignupConfirmType.None;
    required: boolean = false;

    constructor(json?: any) {
        super(json);
        this.parseSignupConfirm(json || {});
    }

    parse(json: any): SignupConfirm {
        super.parse(json);
        this.parseSignupConfirm(json);
        return this;
    }

    private parseSignupConfirm(json: any) {
        this.__assignFields(json, ['type', 'required']);
    }

}
