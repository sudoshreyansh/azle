use cdk_framework::act::node::canister_method::CanisterMethodType;

use crate::{
    canister_method_annotation::CanisterMethodAnnotation,
    errors::{ErrorMessage, Suggestion},
    ts_ast::{module_item::ModuleItemHelperMethods, source_map::GetSourceFileInfo, Item},
};

pub fn build_extraneous_decorator_error_message(
    custom_decorator_module_item: &Item,
) -> ErrorMessage {
    let span = custom_decorator_module_item.as_expr_stmt().unwrap().span;

    let annotation_type = match CanisterMethodAnnotation::from_item(custom_decorator_module_item) {
        Ok(annotation) => match annotation.method_type {
            CanisterMethodType::Heartbeat => "$heartbeat",
            CanisterMethodType::Init => "$init",
            CanisterMethodType::InspectMessage => "$inspect_message",
            CanisterMethodType::PostUpgrade => "$post_upgrade",
            CanisterMethodType::PreUpgrade => "$pre_upgrade",
            CanisterMethodType::Query => "$query",
            CanisterMethodType::Update => "$update",
        },
        Err(err) => panic!(err.error_message()),
    };
    let range = custom_decorator_module_item.source_map.get_range(span);
    let example_function_declaration =
        "export function some_canister_method() {\n  // method body\n}";

    ErrorMessage {
        title: format!("extraneous {} annotation", annotation_type),
        origin: custom_decorator_module_item.source_map.get_origin(span),
        line_number: custom_decorator_module_item
            .source_map
            .get_line_number(span),
        source: custom_decorator_module_item.source_map.get_source(span),
        range,
        annotation: "expected this to be followed by an exported function declaration".to_string(),
        suggestion: Some(Suggestion {
            title: "Follow it with an exported function declaration or remove it. E.g.:"
                .to_string(),
            source: format!(
                "{}\n{}",
                custom_decorator_module_item.source_map.get_source(span),
                example_function_declaration
            ),
            range: (range.1 + 1, range.1 + example_function_declaration.len()),
            annotation: None,
            import_suggestion: None,
        }),
    }
}
