export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}
