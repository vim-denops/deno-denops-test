function! s:load_plugin(name, script) abort
  try
    call denops#server#wait_async({ -> denops#plugin#load(a:name, a:script) })
  catch /^Vim\%((\a\+)\)\=:E117:/
    execute printf(
          \ 'autocmd User DenopsReady call denops#plugin#register(''%s'', ''%s'')',
          \ a:name,
          \ a:script,
          \)
  endtry
endfunction

function! DenopsTestStart(path, name, script) abort
  let g:denops#_test = 1
  execute printf('set runtimepath^=%s', substitute(a:path, ' ', '\\ ', 'g'))
  call s:load_plugin(a:name, a:script)
  call denops#server#start()
endfunction
