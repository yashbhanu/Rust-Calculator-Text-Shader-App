use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate(expression: &str) -> Result<f64, JsValue> {
    // Simple parser for mathematical expressions
    match eval_expression(expression) {
        Ok(result) => Ok(result),
        Err(msg) => Err(JsValue::from_str(&format!("Error: {}", msg))),
    }
}

// Simple recursive descent parser for basic math expressions
fn eval_expression(expr: &str) -> Result<f64, String> {
    let expr = expr.replace(" ", "");
    let chars: Vec<char> = expr.chars().collect();
    let (result, _) = parse_addition(&chars, 0)?;
    Ok(result)
}

fn parse_addition(chars: &[char], pos: usize) -> Result<(f64, usize), String> {
    let (mut left, mut next_pos) = parse_multiplication(chars, pos)?;
    
    while next_pos < chars.len() {
        match chars[next_pos] {
            '+' => {
                let (right, new_pos) = parse_multiplication(chars, next_pos + 1)?;
                left += right;
                next_pos = new_pos;
            },
            '-' => {
                let (right, new_pos) = parse_multiplication(chars, next_pos + 1)?;
                left -= right;
                next_pos = new_pos;
            },
            _ => break,
        }
    }
    
    Ok((left, next_pos))
}

fn parse_multiplication(chars: &[char], pos: usize) -> Result<(f64, usize), String> {
    let (mut left, mut next_pos) = parse_parentheses(chars, pos)?;
    
    while next_pos < chars.len() {
        match chars[next_pos] {
            '*' => {
                let (right, new_pos) = parse_parentheses(chars, next_pos + 1)?;
                left *= right;
                next_pos = new_pos;
            },
            '/' => {
                let (right, new_pos) = parse_parentheses(chars, next_pos + 1)?;
                if right == 0.0 {
                    return Err("Division by zero".to_string());
                }
                left /= right;
                next_pos = new_pos;
            },
            _ => break,
        }
    }
    
    Ok((left, next_pos))
}

fn parse_parentheses(chars: &[char], pos: usize) -> Result<(f64, usize), String> {
    if pos >= chars.len() {
        return Err("Unexpected end of expression".to_string());
    }
    
    if chars[pos] == '(' {
        let (result, next_pos) = parse_addition(chars, pos + 1)?;
        
        if next_pos >= chars.len() || chars[next_pos] != ')' {
            return Err("Missing closing parenthesis".to_string());
        }
        
        return Ok((result, next_pos + 1));
    }
    
    parse_number(chars, pos)
}

fn parse_number(chars: &[char], pos: usize) -> Result<(f64, usize), String> {
    let mut i = pos;
    let mut num_str = String::new();
    
    // Handle negative numbers
    if i < chars.len() && chars[i] == '-' {
        num_str.push('-');
        i += 1;
    }
    
    // Parse digits before decimal point
    while i < chars.len() && chars[i].is_digit(10) {
        num_str.push(chars[i]);
        i += 1;
    }
    
    // Parse decimal point and digits after
    if i < chars.len() && chars[i] == '.' {
        num_str.push('.');
        i += 1;
        
        while i < chars.len() && chars[i].is_digit(10) {
            num_str.push(chars[i]);
            i += 1;
        }
    }
    
    if num_str.is_empty() || num_str == "-" {
        return Err("Invalid number".to_string());
    }
    
    match num_str.parse::<f64>() {
        Ok(num) => Ok((num, i)),
        Err(_) => Err("Failed to parse number".to_string()),
    }
}