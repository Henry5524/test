import { compareNumbers, compareStrings } from '@utils/sort-functions';
import { BaseModel } from '../base';

interface WithCustomProps {
    custom_props: { [id: string]: any };
}

export enum CustomPropertyType {
    // eslint-disable-next-line id-blacklist
    String = 'string',
    Integer = 'integer',
    Float = 'float',
}

export const CustomPropertyName = {
    [CustomPropertyType.String]: 'String',
    [CustomPropertyType.Integer]: 'Integer',
    [CustomPropertyType.Float]: 'Float',
};

export const CustomPropertySortFn = {
    [CustomPropertyType.String]: (name: string) => (a: WithCustomProps, b: WithCustomProps) => compareStrings(a.custom_props[name], b.custom_props[name]),
    [CustomPropertyType.Integer]: (name: string) => (a: WithCustomProps, b: WithCustomProps) => compareNumbers(a.custom_props[name], b.custom_props[name]),
    [CustomPropertyType.Float]: (name: string) => (a: WithCustomProps, b: WithCustomProps) => compareNumbers(a.custom_props[name], b.custom_props[name]),
};

export const CustomPropertyFormat = {
    [CustomPropertyType.String]: (d: string) => d,
    [CustomPropertyType.Integer]: (d: number) => d,
    [CustomPropertyType.Float]: (d: number, cp: CustomProperty) => cp.frac_digits == null ? d : d.toFixed(cp.frac_digits),
};

export class CustomProperty extends BaseModel {
    static Type = CustomPropertyType;
    type!: CustomPropertyType;
    name!: string;
    title?: string;
    str_values?: string[];
    frac_digits?: number;

    constructor(json?: any) {
        super(json);
        this.parseCustomProperty(json || {});
    }

    parse(json: any): CustomProperty {
        super.parse(json);
        this.parseCustomProperty(json);
        return this;
    }

    private parseCustomProperty(json: any) {
        this.__assignFields(json, ['type', 'name', 'title', 'str_values', 'frac_digits']);
        if (!this.title) {
            this.title = this.name;
        }
    }

}
