export class BaseModel {

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor(_json?: any) {}

    parse(_json: any): BaseModel {
        return this;
    }

    __assignFields(json: any, names: string[]) {
        if (json) {
            const me: any = this;
            for (const name of names) {
                if (me[name] === undefined) {
                    if (json[name] !== undefined && json[name] !== null) {
                        if (Array.isArray(json[name])) {
                            me[name] = [];
                            for (const item of json[name]) {
                                me[name].push(item);
                            }
                        }
                        else {
                            me[name] = json[name];
                        }
                    }
                    else {
                        me[name] = null;
                    }
                }
                else if (json[name] !== undefined) {
                    if (Array.isArray(json[name])) {
                        me[name] = [];
                        for (const item of json[name]) {
                            me[name].push(item);
                        }
                    }
                    else {
                        me[name] = json[name];
                    }
                }
            }
        }
    }

    __assignClassFields(json: any, fields: { [name: string]: typeof BaseModel }) {
        if (json) {
            const me: any = this;
            Object.keys(fields).forEach(name => {
                const Clazz = fields[name];
                if (me[name] === undefined) {
                    me[name] = (json[name] !== undefined && json[name] !== null) ? new Clazz(json[name]) : null;
                }
                else if (json[name] !== undefined && json[name] !== null) {
                    me[name] = new Clazz(json[name]);
                }
            });
        }
    }

    __assignClassArrays(json: any, fields: { [name: string]: typeof BaseModel }) {
        if (json) {
            const me: any = this;
            Object.keys(fields).forEach(name => {
                const Clazz = fields[name];
                if (me[name] === undefined) {
                    me[name] = BaseModel.__getClassArray(json, name, Clazz);
                }
                else if (json[name] !== undefined && json[name] !== null && Array.isArray(json[name])) {
                    me[name] = [];
                    for (const obj of json[name]) {
                        me[name].push(new Clazz(obj));
                    }
                }
            });
        }
    }

    static __getClassArray<T extends BaseModel>(json: any, name: string, Clazz: typeof BaseModel): T[] | null {
        if (json[name] !== undefined && json[name] !== null && Array.isArray(json[name])) {
            const res: T[] = [];
            for (const obj of json[name]) {
                res.push(new Clazz(obj) as T);
            }
            return res;
        }
        return null;
    }

}
