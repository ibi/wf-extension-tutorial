
rmdir .\build /s /q
mkdir .\build

mkdir .\build\com.ibi.d3_bar_chart
mkdir .\build\com.ibi.d3_bar_chart\css
mkdir .\build\com.ibi.d3_bar_chart\icons
mkdir .\build\com.ibi.d3_bar_chart\lib

xcopy src\css\*.* .\build\com.ibi.d3_bar_chart\css
xcopy src\icons\*.* .\build\com.ibi.d3_bar_chart\icons
xcopy src\lib\*.* .\build\com.ibi.d3_bar_chart\lib
copy  src\com.ibi.d3_bar_chart_32.js .\build\com.ibi.d3_bar_chart\com.ibi.d3_bar_chart.js
copy  src\properties.json .\build\com.ibi.d3_bar_chart\properties.json


