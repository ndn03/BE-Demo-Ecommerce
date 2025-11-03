/* eslint-disable no-useless-escape */
export const regexPhone = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
export const regexNumber = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
export const regexEmail =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const regexPwdStrong =
  /^(?=.*[0-9])(?=.*[!@#$%^&*()_+-=[]{}|;:,.<>?])[a-zA-Z0-9!@#$%^&*()_+-=[]{}|;:,.<>?]{6,15}$/;
export const regexUrl = /(^http[s]?:\/{2})|(^www)|(^\/{1,2})/;
export const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const regexUsername = /^[a-zA-Z0-9_.]{3,30}$/;
export const regexAlphabet = /^[a-zA-Z]*$/;
export const regexAZUppercase = /^[A-Z]*$/;

export const regexImage = /\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/;
export const regexVideo =
  /\.(mp4|mov|mwv|avi|mkv|flv|webm|mts|mpeg4|MP4|MOV|WMV|AVI|MKV|FLV|WEBM|MTS|MPEG4)$/;
export const regexAudio =
  /\.(mp3|flac|wav|wma|aac|m4A|M4A|FLAC|MP3|WAV|WMA|AAC)$/;
export const regexDocument =
  /\.(csv|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|xml|odt|ods|CSV|PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX|TXT|XML|ODT|ODS)$/;

export const regexNoWhitespace = /^\S*$/; // no whitespace

export const regexAlphaNumSpecial =
  /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/;
