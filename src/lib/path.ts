// '/peta/' dan '/peta' harus sama: GitHub Pages menyajikan tiap route sebagai folder.
export const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/'