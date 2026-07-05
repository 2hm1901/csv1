# csv1

Website tinh de quan ly bang thiet bi va xem truoc PDF khi click vao cot `Loai_thiet_bi`.

## Cach dung

1. Mo `index.html` bang trinh duyet.
2. Chon `User` de vao thang, hoac chon `Admin` va dang nhap bang tai khoan `giang`, mat khau `giang123`.
3. Che do `User` chi xem bang va click `Loai_thiet_bi` de xem PDF.
4. Che do `Admin` duoc upload CSV, them/sua/xoa dong va gan file PDF.
5. Bam `Them dong` de nhap tay du lieu, hoac `Upload CSV` de nap bang co san.
6. Bam `Gan PDF` tren tung dong de upload file PDF tuong ung. Che do `Admin` se giu PDF goc khong watermark.
7. Ten file PDF se duoc tu dong dien vao cot `Loai_thiet_bi`; neu chua dung thi admin sua truc tiep trong o nay.
8. Click vao gia tri trong cot `Loai_thiet_bi` de xem file PDF.

Du lieu va PDF duoc luu trong IndexedDB cua chinh trinh duyet dang dung. Neu doi may, doi trinh duyet, xoa site data hoac dung che do an danh thi du lieu co the khong con.

## Dinh dang CSV

Hang dau tien la header. App se nhan cac cot sau:

- `Loai_thiet_bi`
- `Ten nha san xuat`
- `SL`
- `Doi may (Model)`
- `Cong suat`
- `Don vi so huu`
- `THOI HAN KIEM DINH`
- `Bien_so`

Ten cot co the viet co dau hoac khong dau.
