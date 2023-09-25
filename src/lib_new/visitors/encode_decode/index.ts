import { IDL } from '@dfinity/candid';
import { DecodeVisitor } from './decode_visitor';
import { EncodeVisitor } from './encode_visitor';
import { AzleResult, Result } from '../../result';
export { EncodeVisitor, DecodeVisitor };

/*
 * The VisitorData gives us js_data which is the data that is about to be
 * encoded or was just decoded. js_class is the CandidClass (IDLable) class that
 * can be used to create the class.
 */
export type VisitorData = { js_data: any; js_class: any };
/**
 * The VisitorResult is the transformed version of js_data that is ready to
 * be consumed by the js or ready to be encoded.
 */
export type VisitorResult = any;

/*
 * For most of the visitors the only thing that needs to happen is to visit each
 * of the sub nodes. That is the same for both encoding and decoding. That logic
 * is extracted into these helper methods.
 */

function handleRecursiveClass(type: any) {
    if (type._azleRecLambda) {
        return type();
    }
    return type;
}

export function visitTuple(
    visitor: DecodeVisitor | EncodeVisitor,
    components: IDL.Type<any>[],
    data: VisitorData
): VisitorResult {
    const fields = components.map((value, index) =>
        value.accept(visitor, {
            js_data: data.js_data[index],
            js_class: handleRecursiveClass(data.js_class._azleTypes[index])
        })
    );
    return [...fields];
}

export function visitOpt(
    visitor: DecodeVisitor | EncodeVisitor,
    ty: IDL.Type<any>,
    data: VisitorData
): VisitorResult {
    if (data.js_data.length === 0) {
        return data.js_data;
    }
    const candid = ty.accept(visitor, {
        js_data: data.js_data[0],
        js_class: handleRecursiveClass(data.js_class._azleType)
    });
    return [candid];
}

export function visitVec(
    visitor: DecodeVisitor | EncodeVisitor,
    ty: IDL.Type<any>,
    data: VisitorData
): VisitorResult {
    if (ty instanceof IDL.PrimitiveType) {
        return data.js_data;
    }
    return data.js_data.map((array_elem: any) => {
        return ty.accept(visitor, {
            js_data: array_elem,
            js_class: handleRecursiveClass(data.js_class._azleType)
        });
    });
}

export function visitRecord(
    visitor: DecodeVisitor | EncodeVisitor,
    fields: [string, IDL.Type<any>][],
    data: VisitorData
): VisitorResult {
    const candidFields = fields.reduce((acc, [memberName, memberIdl]) => {
        const fieldData = data.js_data[memberName];
        const fieldClass = handleRecursiveClass(data.js_class[memberName]);

        return {
            ...acc,
            [memberName]: memberIdl.accept(visitor, {
                js_data: fieldData,
                js_class: fieldClass
            })
        };
    }, {});

    return candidFields;
}

export function visitVariant(
    visitor: DecodeVisitor | EncodeVisitor,
    fields: [string, IDL.Type<any>][],
    data: VisitorData
): VisitorResult {
    if (data.js_class instanceof AzleResult) {
        if ('Ok' in data.js_data) {
            const okField = fields[0];
            const okData = data.js_data['Ok'];
            const okClass = handleRecursiveClass(data.js_class._azleOk);

            return Result.Ok(
                okField[1].accept(visitor, {
                    js_data: okData,
                    js_class: okClass
                })
            );
        }
        if ('Err' in data.js_data) {
            const errField = fields[0];
            const errData = data.js_data['Err'];
            const errClass = handleRecursiveClass(data.js_class._azleErr);
            return Result.Err(
                errField[1].accept(visitor, {
                    js_data: errData,
                    js_class: errClass
                })
            );
        }
    }
    const candidFields = fields.reduce((acc, [memberName, memberIdl]) => {
        const fieldData = data.js_data[memberName];
        const fieldClass = handleRecursiveClass(data.js_class[memberName]);
        if (fieldData === undefined) {
            // If the field data is undefined then it is not the variant that was used
            return acc;
        }
        return {
            ...acc,
            [memberName]: memberIdl.accept(visitor, {
                js_class: fieldClass,
                js_data: fieldData
            })
        };
    }, {});

    return candidFields;
}

export function visitRec<T>(
    visitor: DecodeVisitor | EncodeVisitor,
    ty: IDL.ConstructType<T>,
    data: VisitorData
): VisitorResult {
    // return data.js_data;
    // TODO I imagine that this will be the spot of much torment when we get
    // to doing actual recursive types, maybe
    return ty.accept(visitor, data);
}
