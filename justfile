default:
    @just --list --unsorted

zip extension:
    cd {{extension}}
    zip -r {{extension}}.zip .

commit message:
  git add . && git commit -m "{{message}}" && git push