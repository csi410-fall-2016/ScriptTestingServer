/* Query 10 */

SELECT *
FROM Department, Course, Section
WHERE (ddept = cdept)
    AND (cdept = sdept) 
AND (ccourse = scourse);
