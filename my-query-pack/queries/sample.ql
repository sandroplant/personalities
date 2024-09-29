import javascript

from CallExpression call
where call.getCallee() instanceof Identifier and
      call.getCallee().getName() = "eval"
select call, "Avoid using eval."
