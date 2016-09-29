/* Query 7 */

SELECT Faculty.*, Course.*
FROM Faculty, Course, Section
WHERE (fid = sid) 
  AND (cdept = sdept)
  AND (ccourse = scourse);
