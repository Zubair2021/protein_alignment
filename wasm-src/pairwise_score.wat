(module
  (memory (export "memory") 2)
  (func (export "countMatches") (param $a i32) (param $b i32) (param $len i32) (result i32)
    (local $i i32)
    (local $count i32)
    (local.set $i (i32.const 0))
    (local.set $count (i32.const 0))
    (block $done
      (loop $loop
        (br_if $done (i32.ge_u (local.get $i) (local.get $len)))
        (if (i32.eq
              (i32.load8_u (i32.add (local.get $a) (local.get $i)))
              (i32.load8_u (i32.add (local.get $b) (local.get $i))))
          (then
            (local.set $count (i32.add (local.get $count) (i32.const 1)))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    (return (local.get $count)))
  (func (export "identityPercentage") (param $matches i32) (param $length i32) (result f32)
    (if (result f32) (i32.eqz (local.get $length))
      (then (f32.const 0))
      (else
        (f32.div
          (f32.mul (f32.convert_i32_u (local.get $matches)) (f32.const 100))
          (f32.convert_i32_u (local.get $length))))))
)
