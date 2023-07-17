use proc_macro2::TokenStream;
use quote::quote;

pub fn generate() -> TokenStream {
    quote! {
        fn unwrap_or_trap<SuccessValue, Callback>(callback: Callback) -> SuccessValue
        where
            Callback: FnOnce() -> Result<SuccessValue, RuntimeError>,
        {
            callback()
                .unwrap_or_else(|err| ic_cdk::api::trap(&format!("Uncaught {}", err.to_string())))
        }

        pub trait UnwrapJsResultOrTrap {
            fn unwrap_or_trap(self, context: &mut boa_engine::Context) -> boa_engine::JsValue;
        }

        impl UnwrapJsResultOrTrap for boa_engine::JsResult<boa_engine::JsValue> {
            fn unwrap_or_trap(self, context: &mut boa_engine::Context) -> boa_engine::JsValue {
                match self {
                    Ok(js_value) => js_value,
                    Err(js_error) => {
                        let error_message =
                            js_value_to_string(js_error.to_opaque(context), context);

                        ic_cdk::api::trap(&format!("Uncaught {}", error_message));
                    }
                }
            }
        }

        impl UnwrapJsResultOrTrap for Result<boa_engine::JsValue, String> {
            fn unwrap_or_trap(self, context: &mut boa_engine::Context) -> boa_engine::JsValue {
                match self {
                    Ok(js_value) => js_value,
                    Err(error_string) => {
                        ic_cdk::api::trap(&format!("Uncaught {}", error_string));
                    }
                }
            }
        }

        pub trait UnwrapOrTrapWithMessage<T> {
            fn unwrap_or_trap(self, err_message: &str) -> T;
        }

        impl<T> UnwrapOrTrapWithMessage<T> for Option<T> {
            fn unwrap_or_trap(self, err_message: &str) -> T {
                match self {
                    Some(some) => some,
                    None => {
                        ic_cdk::trap(&format!("Uncaught {}", err_message))
                    }
                }
            }
        }

        fn js_value_to_string(
            error_value: boa_engine::JsValue,
            context: &mut boa_engine::Context,
        ) -> String {
            match &error_value {
                boa_engine::JsValue::BigInt(bigint) => bigint.to_string(),
                boa_engine::JsValue::Boolean(boolean) => boolean.to_string(),
                boa_engine::JsValue::Integer(integer) => integer.to_string(),
                boa_engine::JsValue::Null => "null".to_string(),
                boa_engine::JsValue::Object(object) => {
                    let to_string_js_value = match object.get("toString", context) {
                        Ok(to_string_js_value) => to_string_js_value,
                        Err(err) => return "TypeError: Property 'toString' of object is not a function".to_string(),
                    };

                    let to_string_js_object = match to_string_js_value.as_object() {
                      Some(to_string_js_object) => to_string_js_object,
                      None => return "TypeError: Property 'toString' of object is not a function".to_string() ,
                    };

                    let string_js_value = match to_string_js_object.call(&error_value, &[], context) {
                        Ok(string_js_value) => string_js_value,
                        Err(js_error) => return format!("SystemError: {}", js_error)
                    };

                    match string_js_value.try_from_vm_value(context) {
                        Ok(string) => string,
                        Err(vmc_err) => vmc_err.0
                    }
                }
                boa_engine::JsValue::Rational(rational) => rational.to_string(),
                boa_engine::JsValue::String(string) => match string.to_std_string() {
                    Ok(string) => string,
                    Err(js_error) => return format!("SystemError: {}", js_error)
                }
                boa_engine::JsValue::Symbol(symbol) => symbol.to_string(),
                boa_engine::JsValue::Undefined => "undefined".to_string(),
            }
        }
    }
}