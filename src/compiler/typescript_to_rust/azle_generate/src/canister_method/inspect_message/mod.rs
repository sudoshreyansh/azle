use cdk_framework::act::node::{
    canister_method::CanisterMethodType, canister_method::InspectMessageMethod,
};

use crate::{
    canister_method::errors,
    ts_ast::{azle_program::HelperMethods, TsAst},
};

mod rust;

impl TsAst {
    pub fn build_inspect_message_method(&self) -> Option<InspectMessageMethod> {
        let inspect_message_fn_decls = self
            .azle_programs
            .get_azle_fn_decls_of_type(CanisterMethodType::InspectMessage);

        if inspect_message_fn_decls.len() > 1 {
            let error_message =
                errors::build_duplicate_method_types_error_message_from_azle_fn_decl(
                    inspect_message_fn_decls,
                    CanisterMethodType::InspectMessage,
                );

            panic!("{}", error_message);
        }

        let inspect_message_fn_decl_option = inspect_message_fn_decls.get(0);

        if let Some(inspect_message_fn_decl) = inspect_message_fn_decl_option {
            let body = rust::generate(inspect_message_fn_decl);

            Some(InspectMessageMethod { body })
        } else {
            None
        }
    }
}
