use cdk_framework::act::node::canister_method::{CanisterMethodType, PreUpgradeMethod};

use crate::{
    canister_method::errors,
    ts_ast::{azle_program::HelperMethods, TsAst},
};

mod rust;

impl TsAst {
    pub fn build_pre_upgrade_method(&self) -> Option<PreUpgradeMethod> {
        let pre_upgrade_fn_decls = self
            .azle_programs
            .get_azle_fn_decls_of_type(CanisterMethodType::PreUpgrade);

        if pre_upgrade_fn_decls.len() > 1 {
            let error_message =
                errors::build_duplicate_method_types_error_message_from_azle_fn_decl(
                    pre_upgrade_fn_decls,
                    CanisterMethodType::PreUpgrade,
                );

            panic!("{}", error_message);
        }

        let pre_upgrade_fn_decl_option = pre_upgrade_fn_decls.get(0);

        if let Some(pre_upgrade_fn_decl) = pre_upgrade_fn_decl_option {
            let body = rust::generate(pre_upgrade_fn_decl);
            let guard_function_name = pre_upgrade_fn_decl.annotation.guard.clone();

            Some(PreUpgradeMethod {
                body,
                guard_function_name,
            })
        } else {
            None
        }
    }
}
