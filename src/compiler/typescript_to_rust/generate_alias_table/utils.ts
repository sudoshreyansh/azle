import * as ts from 'typescript';

export function getSourceFile(node: ts.Node): ts.SourceFile | undefined {
    if (ts.isSourceFile(node)) {
        return node;
    }
    if (node.parent === undefined) {
        return undefined;
    }
    return getSourceFile(node.parent);
}

export function getDeclarationFromNamespace(
    namespace: ts.NamespaceImport | ts.NamespaceExport
): ts.ImportDeclaration | ts.ExportDeclaration {
    if (ts.isNamespaceImport(namespace)) {
        return namespace.parent.parent;
    } else {
        return namespace.parent;
    }
}

export function getUnderlyingIdentifierFromSpecifier(
    specifier: ts.ExportSpecifier | ts.ImportSpecifier
): ts.Identifier {
    // e.g. 'thing' in '{thing}' or '{thing as other}'. 'thing' is the symbol we
    // care about. At this point we don't care what it got renamed to, only what
    // it resolves back to.
    if (specifier.propertyName === undefined) {
        // If there is no property name then it was NOT renamed
        return specifier.name;
    } else {
        // If there is a propertyName then it WAS renamed and the property name is the original name before it was renamed
        return specifier.propertyName;
    }
}

export function getDeclarationFromSpecifier(
    specifier: ts.ExportSpecifier | ts.ImportSpecifier
): ts.ImportDeclaration | ts.ExportDeclaration {
    if (ts.isImportSpecifier(specifier)) {
        return specifier.parent.parent.parent;
    } else {
        return specifier.parent.parent;
    }
}