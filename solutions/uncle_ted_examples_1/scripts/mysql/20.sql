/* Query 20 */
/* Find courses that have sections. */

SELECT DISTINCT Course.*
FROM Course, Section
WHERE (cdept = sdept)
  AND (ccourse = scourse);
