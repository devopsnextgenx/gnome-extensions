default:
    @just --list --unsorted

zip extension:
    #!/usr/bin/env bash
    cd {{extension}}
    zip -r {{extension}}.zip .
    mv {{extension}}.zip ..

commit message:
  git add . && git commit -m "{{message}}" && git push