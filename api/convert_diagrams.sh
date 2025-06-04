#!/bin/bash

# 다이어그램을 저장할 디렉토리 생성
mkdir -p diagrams

# 임시 파일 생성을 위한 디렉토리
mkdir -p temp

# arch.md에서 Mermaid 다이어그램 코드 블록을 추출하고 변환
cat arch.md | while IFS= read -r line
do
    if [[ $line == "\`\`\`mermaid" ]]; then
        # 새로운 임시 파일 시작
        diagram_count=$((diagram_count + 1))
        temp_file="temp/diagram_${diagram_count}.mmd"
        echo "" > "$temp_file"
        in_diagram=true
    elif [[ $line == "\`\`\`" && $in_diagram == true ]]; then
        # 다이어그램 파일 변환
        mmdc -i "$temp_file" -o "diagrams/diagram_${diagram_count}.png"
        in_diagram=false
    elif [[ $in_diagram == true ]]; then
        # 다이어그램 내용 저장
        echo "$line" >> "$temp_file"
    fi
done

# 임시 파일 삭제
rm -rf temp

# arch.md 파일을 수정하여 다이어그램 코드를 이미지 참조로 변경
sed -i.bak -e '/```mermaid/,/```/c\![Diagram](diagrams/diagram_'$((diagram_count))'.png)' arch.md

echo "변환 완료! 다이어그램이 diagrams/ 디렉토리에 저장되었습니다." 