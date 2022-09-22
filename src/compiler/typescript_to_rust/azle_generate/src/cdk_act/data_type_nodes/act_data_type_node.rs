use super::{
    arrays::ActArray,
    funcs::ActFunc,
    option::ActOption,
    primitives::{ActPrimitive, ActPrimitiveLit},
    record::ActRecord,
    tuple::ActTuple,
    type_ref::ActTypeRef,
    variants::ActVariant,
    ToIdent, ToTokenStream,
};
use proc_macro2::TokenStream;
use quote::{quote, ToTokens};
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub enum ActDataTypeNode {
    Primitive(ActPrimitive),
    Option(ActOption),
    TypeRef(ActTypeRef),
    Array(ActArray),
    Record(ActRecord),
    Variant(ActVariant),
    Func(ActFunc),
    Tuple(ActTuple),
}

impl ActDataTypeNode {
    // TODO change this to Ident? Or String? or at the very least have the match return an ident and then wrap the result in a quote?
    pub fn get_type_ident(&self) -> TokenStream {
        match self {
            ActDataTypeNode::Primitive(act_primitive) => match act_primitive {
                ActPrimitive::Literal(literal) => literal.to_token_stream(),
                ActPrimitive::TypeAlias(type_alias) => type_alias.name.to_ident().to_token_stream(),
            },
            ActDataTypeNode::TypeRef(act_type_ref) => match act_type_ref {
                ActTypeRef::Literal(literal) => literal.name.to_ident().to_token_stream(),
                ActTypeRef::TypeAlias(type_alias) => type_alias.name.to_ident().to_token_stream(),
            },
            ActDataTypeNode::Array(act_array) => match act_array {
                ActArray::Literal(literal) => literal.to_token_stream(),
                ActArray::TypeAlias(type_alias) => type_alias.name.to_ident().to_token_stream(),
            },
            ActDataTypeNode::Record(act_record) => act_record.name.to_ident().to_token_stream(),
            ActDataTypeNode::Variant(act_variant) => act_variant.name.to_ident().to_token_stream(),
            ActDataTypeNode::Func(act_func) => act_func.name.to_ident().to_token_stream(),
            ActDataTypeNode::Tuple(act_tuple) => act_tuple.name.to_ident().to_token_stream(),
            ActDataTypeNode::Option(act_option) => match act_option {
                ActOption::Literal(literal) => literal.to_token_stream(),
                ActOption::TypeAlias(type_alias) => type_alias.name.to_ident().to_token_stream(),
            },
        }
    }

    // TODO change is_inline to needs to be defined?
    pub fn is_inline_type(&self) -> bool {
        match self {
            ActDataTypeNode::Primitive(_) => false,
            ActDataTypeNode::TypeRef(_) => false,
            ActDataTypeNode::Array(act_array) => act_array.get_enclosed_type().is_inline_type(),
            ActDataTypeNode::Record(act_record) => act_record.is_inline,
            ActDataTypeNode::Variant(act_variant) => act_variant.is_inline,
            ActDataTypeNode::Func(act_func) => act_func.is_inline,
            ActDataTypeNode::Tuple(act_tuple) => act_tuple.is_inline,
            ActDataTypeNode::Option(act_option) => act_option.get_enclosed_type().is_inline_type(),
        }
    }

    pub fn get_definition(&self) -> Option<TokenStream> {
        match self {
            ActDataTypeNode::Record(act_record) => Some(act_record.to_token_stream()),
            ActDataTypeNode::Variant(act_variant) => Some(act_variant.to_token_stream()),
            ActDataTypeNode::Func(act_func) => Some(act_func.to_token_stream()),
            ActDataTypeNode::Tuple(act_tuple) => Some(act_tuple.to_token_stream()),
            ActDataTypeNode::Primitive(act_primitive) => match act_primitive {
                ActPrimitive::Literal(_) => None,
                ActPrimitive::TypeAlias(type_alias) => Some(type_alias.to_token_stream()),
            },
            ActDataTypeNode::TypeRef(act_type_ref) => match act_type_ref {
                ActTypeRef::Literal(_) => None,
                ActTypeRef::TypeAlias(type_alias) => Some(type_alias.to_token_stream()),
            },
            ActDataTypeNode::Option(act_option) => match act_option {
                ActOption::Literal(_) => None,
                ActOption::TypeAlias(type_alias) => Some(type_alias.to_token_stream()),
            },
            ActDataTypeNode::Array(act_array) => match act_array {
                ActArray::Literal(_) => None,
                ActArray::TypeAlias(type_alias) => Some(type_alias.to_token_stream()),
            },
        }
    }

    pub fn needs_to_be_boxed(&self) -> bool {
        true
    }

    pub fn get_inline_members(&self) -> Vec<ActDataTypeNode> {
        match self {
            ActDataTypeNode::Record(act_record) => act_record
                .members
                .iter()
                .filter(|member| member.member_type.is_inline_type())
                .map(|member| member.member_type.clone())
                .collect(),
            ActDataTypeNode::Variant(act_variant) => act_variant
                .members
                .iter()
                .filter(|member| member.member_type.is_inline_type())
                .map(|member| member.member_type.clone())
                .collect(),
            ActDataTypeNode::Func(act_func) => {
                vec![act_func.params.clone(), vec![*act_func.return_type.clone()]]
                    .concat()
                    .iter()
                    .filter(|elem| elem.is_inline_type())
                    .cloned()
                    .collect()
            }
            ActDataTypeNode::Primitive(_) => vec![],
            ActDataTypeNode::TypeRef(_) => vec![],
            ActDataTypeNode::Array(act_array) => vec![act_array.get_enclosed_type()]
                .iter()
                .filter(|enclosed_type| enclosed_type.is_inline_type())
                .cloned()
                .collect(),
            ActDataTypeNode::Tuple(act_tuple) => act_tuple
                .elems
                .iter()
                .filter(|member| member.elem_type.is_inline_type())
                .map(|elem| elem.elem_type.clone())
                .collect(),
            ActDataTypeNode::Option(act_option) => vec![act_option.get_enclosed_type()]
                .iter()
                .filter(|enclosed_type| enclosed_type.is_inline_type())
                .cloned()
                .collect(),
        }
    }

    pub fn collect_inline_types(&self) -> Vec<ActDataTypeNode> {
        let act_data_type = match self.is_inline_type() {
            true => vec![self.clone()],
            false => vec![],
        };
        let member_act_data_types = self.get_inline_members();
        let all_descendant_act_data_types =
            member_act_data_types.iter().fold(vec![], |acc, member| {
                vec![acc, member.collect_inline_types()].concat()
            });
        vec![act_data_type, all_descendant_act_data_types].concat()
    }

    pub fn to_type_definition_token_stream(&self) -> TokenStream {
        match self.get_definition() {
            Some(definition) => definition,
            None => quote!(),
        }
    }
}

pub fn build_inline_types_from_type_alias_acts(
    type_aliases: &Vec<ActDataTypeNode>,
) -> Vec<ActDataTypeNode> {
    type_aliases.iter().fold(vec![], |acc, type_alias| {
        vec![acc, type_alias.collect_inline_types()].concat()
    })
}

pub fn deduplicate(act_data_type_nodes: Vec<ActDataTypeNode>) -> Vec<ActDataTypeNode> {
    let map: HashMap<String, ActDataTypeNode> =
        act_data_type_nodes
            .iter()
            .fold(HashMap::new(), |mut acc, act_node| {
                match acc.get(&act_node.get_type_ident().to_string()) {
                    Some(_) => acc,
                    None => {
                        acc.insert(act_node.get_type_ident().to_string(), act_node.clone());
                        acc
                    }
                }
            });
    map.values().cloned().collect()
}

#[derive(Clone, Debug)]
pub enum ActAliasedType {
    Primitive(ActPrimitiveLit),
    TypeRef(String),
}

impl ToTokenStream for ActAliasedType {
    fn to_token_stream(&self) -> TokenStream {
        match self {
            ActAliasedType::Primitive(primitive) => primitive.to_token_stream(),
            ActAliasedType::TypeRef(type_ref) => type_ref.to_ident().into_token_stream(),
        }
    }
}
