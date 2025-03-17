import 'reflect-metadata';

const AUDIT_METADATA_KEY = Symbol('audit_fields');

export function Audit() {
    return function (target: any, propertyKey: string) {
        const existingFields = Reflect.getMetadata(AUDIT_METADATA_KEY, target.constructor) || [];
        Reflect.defineMetadata(AUDIT_METADATA_KEY, [...existingFields, propertyKey], target.constructor);
    };
}

export function getAuditedFields(target: any): string[] {
    return Reflect.getMetadata(AUDIT_METADATA_KEY, target.constructor) || [];
}
