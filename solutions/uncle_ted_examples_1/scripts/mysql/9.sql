/* Query 9 */

SELECT *
FROM Course, Section
WHERE (cdept=sdept)
AND (ccourse=scourse);
